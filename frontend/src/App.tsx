import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AuthProvider from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;