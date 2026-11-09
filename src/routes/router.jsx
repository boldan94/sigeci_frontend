import { createBrowserRouter } from "react-router";
// import LoginScreen from "../pages/login/LoginScreen";
import LoginScreen from "../pages/auth/LoginScreen";
import ForgotPasswordScreen from "../pages/auth/ForgotPasswordScreen";
import ResetPinScreen from "../pages/auth/ResetPinScreen";
import RegisterScreen from "../pages/auth/RegisterScreen";
import DashboardScreen from "../pages/dashboard/DashboardScreen";
import ComponentsScreen from "../pages/components/ComponentsScreen";
import Dashboard from "../theme/containers/Dashboard";
import ArticleScreen from "../pages/article/ArticleScreen";
import ArticleViewScreen from "../pages/article/ArticleViewScreen";
import ArticleEditScreen from "../pages/article/ArticleEditScreen";
import UserScreen from "../pages/users/UserScreen";
import Container from "../theme/containers/Container";
import ProtectedRoute from "./ProtectedRoute";
import CreateArticlePDFScreen from "../pages/article/CreateArticlePDFScreen";
import CreateArticleScreen from "../pages/article/CreateArticleScreen";
import CreateUserScreen from "../pages/users/CreateUserScreen";
import EditUserScreen from "../pages/users/EditUserScreen";
import UserProfileScreen from "../pages/users/UserProfileScreen";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Container />,
        children: [
            {
                index: true,
                element: <LoginScreen />,
            }
        ]
    },
    {
        path: "/forgot-password",
        element: <Container />,
        children: [
            {
                index: true,
                element: <ForgotPasswordScreen />,
            }
        ]
    },
    {
        path: "/reset-pin",
        element: <Container />,
        children: [
            {
                index: true,
                element: <ResetPinScreen />,
            }
        ]
    },
    { path: "/register", element: <Container />, children: [{ index: true, element: <RegisterScreen /> }] },
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            { element: <Dashboard />, children: [
                { index: true, element: <ComponentsScreen/> },
                { path: "/components", element: <ComponentsScreen/> },
                { path: "/home", element: <DashboardScreen/> },
                { path: "/article", element: <ArticleScreen/> },
                { path: "/article/:id", element: <ArticleViewScreen/> },
                { path: "/article/edit/:id", element: <ArticleEditScreen/> },
                { path: "/article/create", element: <CreateArticleScreen/> },
                { path: "/article/postulate", element: <CreateArticlePDFScreen/> },
                { path: "/users", element: <UserScreen/> },
                { path: "/users/create", element: <CreateUserScreen/> },
                { path: "/users/edit/:id", element: <EditUserScreen/> },
                {path: "/profile", element: <UserProfileScreen/>}
            ]}
        ]
    }
]);

export default router;