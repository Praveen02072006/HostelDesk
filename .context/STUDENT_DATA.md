# HostelDesk - Sample Student Database

This file contains sample student records for development, testing,
authentication, profile auto-population, hostel allocation, complaint
management, and database seeding.

> **Note:** All records below are fictional and intended for development
> purposes only.

------------------------------------------------------------------------

# Default Login Credentials

All student accounts use the following credentials during development.

**Password:** `Student@123`

------------------------------------------------------------------------

## Sample Students

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  Student ID   Name      Gender   Department      Year   Hostel   Block   Floor   Room   Room Type College Email                 Personal Email      Phone
  ------------ --------- -------- --------------- ------ -------- ------- ------- ------ --------- ----------------------------- ------------------- ------------
  SEC24CS001   Aarav     Male     CSE             2nd    Boys     A       1       A101   Double    aarav.sharma@saveetha.ac.in   aarav@gmail.com     +91
               Sharma                             Year   Hostel A                        Sharing                                                     9876543210

  SEC24CS002   Rahul     Male     CSE             2nd    Boys     A       1       A102   Double    rahul@gmail.com               rahul@gmail.com     +91
               Verma                              Year   Hostel A                        Sharing                                                     9876543211

  SEC24CS003   Aditya    Male     CSE             2nd    Boys     A       2       A205   Triple    aditya.kumar@saveetha.ac.in   aditya@gmail.com    +91
               Kumar                              Year   Hostel A                        Sharing                                                     9876543212

  SEC24CS004   Praveen   Male     CSE             3rd    Boys     B       3       B308   Single    praveen.raj@saveetha.ac.in    praveen@gmail.com   +91
               Raj G                              Year   Hostel B                        Sharing                                                     9876543213

  SEC24CS005   Karthik R Male     AI & DS         2nd    Boys     B       2       B210   Double    karthik.r@saveetha.ac.in      karthik@gmail.com   +91
                                                  Year   Hostel B                        Sharing                                                     9876543214

  SEC24CS006   Naveen    Male     IT              1st    Boys     C       1       C110   Triple    naveen.kumar@saveetha.ac.in   naveen@gmail.com    +91
               Kumar                              Year   Hostel C                        Sharing                                                     9876543215

  SEC24CS007   Arjun S   Male     ECE             2nd    Boys     C       2       C208   Double    arjun.s@saveetha.ac.in        arjun@gmail.com     +91
                                                  Year   Hostel C                        Sharing                                                     9876543216

  SEC24CS008   Vishal M  Male     Mechanical      3rd    Boys     A       4       A410   Single    vishal.m@saveetha.ac.in       vishal@gmail.com    +91
                                                  Year   Hostel A                        Sharing                                                     9876543217

  SEC24CS009   Rohit     Male     Civil           1st    Boys     D       1       D112   Triple    rohit.singh@saveetha.ac.in    rohit@gmail.com     +91
               Singh                              Year   Hostel D                        Sharing                                                     9876543218

  SEC24CS010   Harish    Male     Biotechnology   2nd    Boys     D       2       D220   Double    harish.kumar@saveetha.ac.in   harish@gmail.com    +91
               Kumar                              Year   Hostel D                        Sharing                                                     9876543219
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Developer Notes

-   Login using **Student ID** or **College Email** and password **Student@123** (This is the default password for the first login).
-   If a student changes their password via the UI, the new password is meant strictly for logging in. The updated password will be synced to a new section at the bottom of this file.
-   Auto-populate student profiles after login.
-   Students can edit only:
    -   Personal Email
    -   Phone Number
    -   Gender
    -   Emergency Contact (Guardian Name, Relationship, Phone)
-   **Read-only fields** (managed by Admin/College):
    -   First Name, Last Name
    -   Hostel allocation, Department, Year, Student ID
-   Emergency contact updates are automatically synced back to this file.

------------------------------------------------------------------------

## Emergency Contacts

| Student ID | Guardian Name | Relationship | Guardian Phone |
|------------|---------------|--------------|----------------|
| SEC24CS006 | Gnanasekar M | Father  | 9865196238 |

------------------------------------------------------------------------

## Updated Passwords

| Student ID | Current Password |
|------------|------------------|
| SEC24CS006 | `Harini` |
