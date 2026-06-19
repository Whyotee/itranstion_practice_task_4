import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";


function App() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [loggedInUser, setLoggedInUser] = useState(null);

  function handleLoginSuccess (user) {
    setLoggedInUser(user);
    setCurrentScreen("dashboard");
  }

  function handleLogout() {
    setLoggedInUser(null);
    setCurrentScreen("login");
  }


  return (
    <div className="bg-light min-vh-100 py-5">
      
      {currentScreen !== "dashboard" && ( 
        <nav className="text-center mb-4">        
          <button className="btn btn-link" onClick={() => setCurrentScreen('register')}>  Sign up!</button> | 
          <button className="btn btn-link" onClick={() => setCurrentScreen('login')}>Login</button>
        </nav>
      )}
     
      {currentScreen === 'register' && <Register />}
      
      {currentScreen === 'login' && (<Login onLoginSuccess={handleLoginSuccess} />)}
      
      {currentScreen === 'dashboard' && loggedInUser &&( <Dashboard currentAdmin={loggedInUser} onLogout={handleLogout} /> )}
    </div>
  );
}

export default App;