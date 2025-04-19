import "./App.css";
import Chat from "./components/chat";
import { AgriculturalSubsidyForm } from "./components/subsidy-form";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SchemeUploader from "./components/scheme-summary";
import LandingPage from "./components/home";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-">
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/subsidy" element={<AgriculturalSubsidyForm />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/scheme" element={<SchemeUploader />} />
          </Routes>
        </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;
