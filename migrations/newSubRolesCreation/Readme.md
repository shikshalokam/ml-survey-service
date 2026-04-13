## Migrations

#### Steps to run the script files

This script is intended to a update the new roles in solution and program 5,1.0 release.

In order to execute this migration script, we need to first log in to the pod where the service is running and then proceed with the provided instructions.

---

## Pre-Migration Setup (Prerequisites)

Before executing the migration scripts, ensure the following steps are completed:

- Verify the availability of required sub-roles in the `userRoles` collection.
- Identify any new sub-roles that need to be added as part of this release.
- If a sub-role does not exist, create it using the bulkCreate API.

### API Details

- **Endpoint:** `/mlsurvey/api/v1/userRoles/bulkCreate`
- **Purpose:** Create new sub-roles required for solution and program mapping.

### Responsibility

- This step must be completed by the **Support Team**.

### Important Notes

- Ensure all required sub-roles are created before running the migration.
- Missing sub-roles may cause migration failure or incorrect mappings.

---

### sample CSV file - 
https://docs.google.com/spreadsheets/d/10__4a6qPwT78rawaCnePxQtdEHtfZtoC1llZ_bG6m0c/edit?gid=1431178524#gid=1431178524

### Step 1:

    Navigate to /opt/survey/migrations/newSubRolesCreation/

### Step 2:

Run the script to add roles in all the Program and solutions document .

    node createNewSubRoles.js path/to/your/csvfile.csv

To add roles in specific Program or solution run below command:

Run the script to add roles in specific Program  .

    node createNewSubRoles.js path/to/your/csvfile.csv programId=abc123

Run the script to add roles in specific Solution  .

    node createNewSubRoles.js path/to/your/csvfile.csv solutionId=abc123

#### Validation 

`updated_solution_records_<UUID>.txt`: Contains details of updated records in the solutions collection.
`updated_program_records_<UUID>.txt`: Contains details of updated records in the programs collection.

To validate particular program Or solution 

Run the script to Check roles in specific Program  .

  node verifyRoleInsertion.js programId=6531fdaf0a2ec70012ab3456,6531fdaf0a2ec70012ab3456

Run the script to Check roles in specific Solutions  .

  node verifyRoleInsertion.js solutionId=6531fdaf0a2ec70012ab3456,6531fdaf0a2ec70012ab3456

script execution was successful.