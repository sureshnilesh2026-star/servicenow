import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './components/HomePage';
import { PersonalInfoView } from './components/PersonalInfoView';
import { ParticipantView } from './components/ParticipantView';
import { AdminView } from './components/AdminView';

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      {
        path: '/',
        Component: HomePage,
      },
      {
        path: '/participant-info',
        Component: PersonalInfoView,
      },
      {
        path: '/participant',
        Component: ParticipantView,
      },
      {
        path: '/admin',
        Component: AdminView,
      },
    ],
  },
]);
