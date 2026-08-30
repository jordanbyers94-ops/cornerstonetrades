import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import DirectoryPage from "./DirectoryPage";
import SignUpPage from "./SignUpPage";
import AdminPage from "./AdminPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DirectoryPage />} />
        <Route path="/list-your-business" element={<SignUpPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}
