import { Routes } from '@angular/router';
import { ProfileSearchComponent } from './components/profile-search/profile-search.component';

export const routes: Routes = [
  { path: '', component: ProfileSearchComponent },
  { path: 'dashboard/:user', component: ProfileSearchComponent },
  { path: 'dashboard/:user/:json', component: ProfileSearchComponent },
  { path: 'dashboard/compare/:user1/:user2', component: ProfileSearchComponent },
  { path: 'dashboard/compare/:user1/:user2/:json', component: ProfileSearchComponent },
  { path: '**', redirectTo: '' }
];
