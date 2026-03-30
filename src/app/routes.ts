import { createBrowserRouter } from "react-router";
import CoursewareList from "./pages/CoursewareList";
import EditorPage from "./pages/EditorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: CoursewareList,
  },
  {
    path: "/editor",
    Component: EditorPage,
  },
]);
