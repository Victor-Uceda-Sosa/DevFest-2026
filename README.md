# MedStudent Pro

Payments are powered by [Flowglad](https://flowglad.com). Paid features (Mock Interviews, Exam Prep, Study Scheduling) are gated until the user has access.

## Payments (Flowglad)

1. **Environment**: Ensure `.env` in the project root contains your Flowglad secret key:
   ```bash
   FLOWGLAD_SECRET_KEY="sk_test_..."
   ```

2. **Run the app**: You need both the Flowglad API server and the Vite dev server.
   - Terminal 1: `npm run server` (runs the Flowglad proxy at http://localhost:3001)
   - Terminal 2: `npm run dev` (runs the app at http://localhost:3000)

3. **Flowglad dashboard**: In [Flowglad](https://app.flowglad.com), create a pricing model with:
   - A **feature** with slug `pro` (used to gate paid content).
   - A **price** with slug `pro_monthly` (or update `BillingGate` in `src/components/BillingGate.tsx` to use your price slug).

Until you add real auth, the app uses a persistent guest ID in `localStorage` to represent the customer. Replace `getCustomerDetails` in `server/flowglad.js` with your user lookup when you add authentication.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the Vite dev server. Open [http://localhost:3000](http://localhost:3000). For billing to work, also run `npm run server` in another terminal.

### `npm run server`

Runs the Flowglad API server (port 3001). Required for the billing UI and checkout; the Vite dev server proxies `/api` to it.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
