import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {categoriesPath, defaultPath, expensesPath, loginPath} from './shared/routes';
import {AuthGuard} from "./shared/guard/auth.guard";
import {LoginComponent} from "./shared/login/login.component";

const routes: Routes = [
  {
    path: '',
    redirectTo: defaultPath,
    pathMatch: 'full',
  },
  {
    path: categoriesPath,
    loadChildren: () => import('./category/category.module').then((m) => m.CategoryModule),
    canActivate: [AuthGuard],
    title: 'Categories'
  },
  {
    path: expensesPath,
    loadChildren: () => import('./expense/expense.module').then((m) => m.ExpenseModule),
    canActivate: [AuthGuard],
    title: 'Expenses'
  },
  {
    path: loginPath,
    component: LoginComponent
  },
  // Catch-all Route
  {
    path: '**',
    redirectTo: defaultPath,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
