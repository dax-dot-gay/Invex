import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../views/layout/Layout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
    },
]);
