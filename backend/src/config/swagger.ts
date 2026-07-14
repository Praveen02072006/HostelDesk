import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HostelDesk API',
      version: '1.0.0',
      description: 'Smart Hostel Complaint & Maintenance Management Platform API',
      contact: {
        name: 'HostelDesk Team',
        email: 'support@hosteldesk.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}/api`, description: 'Development' },
      { url: 'https://api.hosteldesk.com/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #667eea; }',
    customSiteTitle: 'HostelDesk API Docs',
  }));

  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
};
