const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/if \(\!seeded\) \{[\s\S]*?\} else \{/,
`if (!seeded) {
          // First time database initialization: seed arrays for dynamic entities with INITIAL values
          fireEmployees = INITIAL_EMPLOYEES;
          fireSettings = INITIAL_SETTINGS;
          fireIdentity = INITIAL_IDENTITY;
          fireNotifications = [];
          fireContracts = [];
          fireTargets = [];
          fireReports = [];
          fireAgreements = INITIAL_AGREEMENTS;

          await saveCollectionList('employees', INITIAL_EMPLOYEES);
          await saveDocument('settings', 'current', INITIAL_SETTINGS);
          await saveDocument('identity', 'current', INITIAL_IDENTITY);
          await saveCollectionList('notifications', []);
          await saveCollectionList('contracts', []);
          await saveCollectionList('reporterTargets', []);
          await saveCollectionList('newsReports', []);
          await saveCollectionList('agreements', INITIAL_AGREEMENTS);
          
          await markSystemSeeded();
        } else {`);

code = code.replace(/fireEmployees = await fetchCollection<Employee>\('employees', \[\]\);/,
`fireEmployees = await fetchCollection<Employee>('employees', INITIAL_EMPLOYEES);`);

code = code.replace(/fireAgreements = await fetchCollection<PerformanceAgreement>\('agreements', \[\]\);/,
`fireAgreements = await fetchCollection<PerformanceAgreement>('agreements', INITIAL_AGREEMENTS);`);

fs.writeFileSync('src/App.tsx', code);
