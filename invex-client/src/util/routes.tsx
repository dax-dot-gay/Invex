import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../views/layout/Layout";
import { HomePage } from "../views/home/HomePage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [{ path: "/", element: <HomePage /> }],
    },
]);
