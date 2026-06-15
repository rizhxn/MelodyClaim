Update the backend deployment setup to ensure better-sqlite3 builds correctly on a Linux environment like Render.

Make ONLY the following changes:

1. In backend/package.json:

   * Modify the install process so better-sqlite3 is built from source.

2. Replace the existing "postinstall" script with:
   "postinstall": "npm rebuild better-sqlite3 --build-from-source"

3. Additionally, ensure the Node version is explicitly defined by adding:
   "engines": {
   "node": "18.x"
   }

4. Do NOT modify any application logic, routes, controllers, or database code.

5. Output:

   * Updated package.json scripts and engines section
   * Confirmation that no other files were changed

Goal:
Ensure better-sqlite3 compiles successfully on Render and eliminate ERR_DLOPEN_FAILED errors.
