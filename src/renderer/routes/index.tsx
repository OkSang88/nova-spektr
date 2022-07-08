import Routes from './routes';
import TestRoute from '@screens/TestRoute/TestRoute';
import Main from '@screens/Main/Main';

// React router v6 hint:
// https://github.com/remix-run/react-router/blob/main/docs/upgrading/v5.md#use-useroutes-instead-of-react-router-config
const routesConfig = [
  { path: Routes.TEST, element: <TestRoute /> },
  { path: '/', element: <Main /> },
];

export default routesConfig;
