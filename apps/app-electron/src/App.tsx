/**
 * App Entry Point (Electron)
 * 
 * This is the root component that renders the Electron shell.
 * The shell handles platform-specific initialization and provides
 * the adapter to the rest of the application.
 */

import ElectronShell from './ElectronShell';

function App() {
  return <ElectronShell />;
}

export default App;
