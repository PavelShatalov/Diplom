import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind
import App from "./App";

import { AuthProvider } from "./AuthContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<DndProvider backend={HTML5Backend}>
				<App />
			</DndProvider>
		</AuthProvider>
	</React.StrictMode>
);
