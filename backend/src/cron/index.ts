import { prisma } from '../config/database';
import { emitNotification } from '../socket';
import { logger } from '../utils/logger';

// ============================================================
// CRON: Check SLA Breaches every 30 minutes
// ============================================================
export const checkSLABreaches = async () => {
  try {
    const now = new Date();

    // Find complaints with passed SLA deadline that aren't marked breached
    const breachedComplaints = await prisma.complaint.findMany({
      where: {
        slaDeadline: { lt: now },
        slaBreached: false,
        status: { notIn: ['COMPLETED', 'CLOSED', 'ARCHIVED', 'CANCELLED'] },
      },
      include: {
        hostel: { include: { admins: { include: { user: true } } } },
      },
    });

    if (breachedComplaints.length > 0) {
      await prisma.complaint.updateMany({
        where: { id: { in: breachedComplaints.map(c => c.id) } },
        data: { slaBreached: true },
      });

      // Batch create all notifications in parallel
      const notificationPromises: Promise<unknown>[] = [];
      for (const complaint of breachedComplaints) {
        for (const admin of complaint.hostel.admins) {
          notificationPromises.push(
            prisma.notification.create({
              data: {
                userId: admin.userId,
                title: '⚠️ SLA Breach Alert',
                message: `Complaint #${complaint.ticketNumber} has breached SLA deadline`,
                type: 'SLA_BREACH',
                complaintId: complaint.id,
              },
            })
          );
          emitNotification(admin.userId, {
            title: '⚠️ SLA Breach Alert',
            message: `Complaint #${complaint.ticketNumber} breached SLA`,
            type: 'SLA_BREACH',
            complaintId: complaint.id,
          });
        }
      }
      await Promise.all(notificationPromises);

      logger.info(`SLA check: ${breachedComplaints.length} complaints breached SLA`);
    }
  } catch (error) {
    logger.error('SLA check cron error:', error);
  }
};

// ============================================================
// CRON: Send deadline reminders to workers
// ============================================================
export const sendDeadlineReminders = async () => {
  try {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const urgentAssignments = await prisma.assignment.findMany({
      where: {
        deadline: { lte: twoHoursFromNow, gte: new Date() },
        status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
      },
      include: {
        worker: true,
        complaint: true,
      },
    });

    // Batch create all deadline reminder notifications
    await Promise.all(urgentAssignments.map(assignment =>
      prisma.notification.create({
        data: {
          userId: assignment.worker.userId,
          title: '⏰ Deadline Approaching',
          message: `Complaint #${assignment.complaint.ticketNumber} deadline is in 2 hours`,
          type: 'DEADLINE_REMINDER',
          complaintId: assignment.complaintId,
        },
      })
    ));
    // Emit socket notifications (non-blocking)
    for (const assignment of urgentAssignments) {
      emitNotification(assignment.worker.userId, {
        title: '⏰ Deadline Approaching',
        message: `Complaint #${assignment.complaint.ticketNumber} deadline approaching`,
        type: 'DEADLINE_REMINDER',
        complaintId: assignment.complaintId,
      });
    }

    logger.info(`Deadline reminders sent: ${urgentAssignments.length}`);
  } catch (error) {
    logger.error('Deadline reminder cron error:', error);
  }
};

// ============================================================
// CRON: Clean up expired refresh tokens
// ============================================================
export const cleanupExpiredTokens = async () => {
  try {
    const deleted = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    logger.info(`Cleaned up ${deleted.count} expired refresh tokens`);
  } catch (error) {
    logger.error('Token cleanup error:', error);
  }
};

// ============================================================
// CRON: Archive old closed complaints (older than 30 days)
// ============================================================
export const archiveOldComplaints = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const archived = await prisma.complaint.updateMany({
      where: {
        status: 'CLOSED',
        closedAt: { lt: thirtyDaysAgo },
      },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    logger.info(`Archived ${archived.count} old complaints`);
  } catch (error) {
    logger.error('Archive complaints cron error:', error);
  }
};

// ============================================================
// START ALL CRON JOBS
// ============================================================
export const startCronJobs = () => {
  // Check SLA every 30 minutes
  setInterval(checkSLABreaches, 30 * 60 * 1000);

  // Deadline reminders every hour
  setInterval(sendDeadlineReminders, 60 * 60 * 1000);

  // Cleanup expired tokens every day
  setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

  // Archive old complaints daily
  setInterval(archiveOldComplaints, 24 * 60 * 60 * 1000);

  // Run immediately on startup
  checkSLABreaches();
  cleanupExpiredTokens();

  logger.info('✅ Cron jobs started');
};
