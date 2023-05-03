## OCI Delta data migration of observation, observationSubmissions, surveys and surveySubmissions
Steps to run the migration files
-  Navigate to migrations/deltaDataMigrationForOCI/ folder
- Run the script which will migrate Azure delta data to OCI.Please provide azure database name with the command
- if Azure database name is sl-prod-old then ..
    > node deltaDataMigrationScriptForOCI.js sl-prod-old