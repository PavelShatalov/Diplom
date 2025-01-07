import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Calendar from "./components/CalendarIntegration/Calendar";

function App() {
	return (
		<BrowserRouter>
			<NavBar />
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				{/* Защищенный маршрут на "/" */}
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<Calendar />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
