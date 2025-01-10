import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../views/layout/Layout";
import { HomePage } from "../views/home/HomePage";
import { AdminPage } from "../views/admin/AdminPage";
import { RedeemInviteView } from "../views/client/redeem/RedeemInvite";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/admin", element: <AdminPage /> },
            { path: "/inv/:code", element: <RedeemInviteView /> },
        ],
    },
]);
