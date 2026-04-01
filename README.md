# vujs-calendar

Calendar using Vue.js created as a test task

## Functionality

- Ability to add a new "event" (max 30 chars) for a user-entered day and time
- Display events on the calendar view in the correct time order
- Allow the user to select a color when creating a reminder and display it appropriately
- Properly display events, that should take place at the same time
- Ability to edit events – including changing text, day and time & color
- Ability to delete events
- Ability to drag and drop events
- Ability to change months/weeks/dates on click
- Stated saved in local storage so that the events are kept on reload

## GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions** (not “Deploy from a branch”). If Pages still uses the `main` or `gh-pages` branch, the app’s JS/CSS will 404 because those branches are not your built `dist`.
2. Push to `main` and wait for the **Deploy to GitHub Pages** workflow to finish.
3. Hard-refresh the site or use a private window after deploy.
