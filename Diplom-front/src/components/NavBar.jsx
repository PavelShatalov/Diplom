import React, { useContext } from "react";
import { AuthContext } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";

const NavBar = () => {
	const { token, logoutUser } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleLogout = () => {
		logoutUser();
		navigate("/login");
	};

	return (
		<nav className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
			<div className="text-xl font-bold">
				<Link to="/">Calendar App</Link>
			</div>
			<div>
				{token ? (
					<button
						onClick={handleLogout}
						className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
						Logout
					</button>
				) : (
					<>
						<Link
							to="/login"
							className="mr-2 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
							Login
						</Link>
						<Link
							to="/register"
							className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
							Register
						</Link>
					</>
				)}
			</div>
		</nav>
	);
};

export default NavBar;
