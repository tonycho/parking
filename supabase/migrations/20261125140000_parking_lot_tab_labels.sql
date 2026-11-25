-- Map tab labels shown on the dashboard.

UPDATE parking_lots
SET tab_label = 'Bank'
WHERE name = 'Cumberland Parking';

UPDATE parking_lots
SET tab_label = 'School'
WHERE name = 'Overflow Parking';