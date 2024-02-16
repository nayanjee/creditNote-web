import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DataTablesModule } from "angular-datatables";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxModule } from '@angular-redux/store';
import { NgRedux, DevToolsExtension } from '@angular-redux/store';
import { rootReducer, ArchitectUIState } from './ThemeOptions/store';
import { ConfigActions } from './ThemeOptions/store/config.actions';
import { AppRoutingModule } from './app-routing.module';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

// BOOTSTRAP COMPONENTS
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// LAYOUT
import { BaseLayoutComponent } from './Layout/base-layout/base-layout.component';
import { PagesLayoutComponent } from './Layout/pages-layout/pages-layout.component';
import { PageTitleComponent } from './Layout/Components/page-title/page-title.component';

// HEADER
import { HeaderComponent } from './Layout/Components/header/header.component';
import { UserBoxComponent } from './Layout/Components/header/elements/user-box/user-box.component';

// SIDEBAR
import { SidebarComponent } from './Layout/Components/sidebar/sidebar.component';

// FOOTER
import { FooterComponent } from './Layout/Components/footer/footer.component';

// Dashboards
import { AnalyticsComponent } from './DemoPages/Dashboards/analytics/analytics.component';

// Pages
import { ForgotPasswordBoxedComponent } from './DemoPages/UserPages/forgot-password-boxed/forgot-password-boxed.component';
import { LoginBoxedComponent } from './login/login-boxed.component';
import { RegisterBoxedComponent } from './DemoPages/UserPages/register-boxed/register-boxed.component';

// Components
import { ModalsComponent } from './DemoPages/Components/modals/modals.component';
import { TooltipsPopoversComponent } from './DemoPages/Components/tooltips-popovers/tooltips-popovers.component';

import { ChangePasswordComponent } from './Change/password/change-password.component';

import { AddClaimComponent } from './Stockiest/add-claim/add-claim.component';
import { EditClaimComponent } from './Stockiest/edit-claim/edit-claim.component';
import { DraftClaimComponent } from './Stockiest/draft-claim/draft-claim.component';
import { ClaimStatusComponent } from './Stockiest/claim-status/claim-status.component';

import { StockiestClaimComponent } from './HeadOffice/stockiest-claim/stockiest-claim.component';
import { ClaimApprovalComponent } from './HeadOffice/claim-approval/claim-approval.component';
import { FoApprovalComponent } from './HeadOffice/fo-approval/fo-approval.component';
import { StatusClaimComponent } from './HeadOffice/status-claim/status-claim.component';

import { UploadHoComponent } from './Upload/sales_ho/uploads.component';
import { UploadDistComponent } from './Upload/sales_dist/uploads.component';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule, IConfig } from 'ngx-mask';
import { AddUserComponent } from './Users/add-user/add-user.component';
import { ListUserComponent } from './Users/list-user/list-user.component';
import { TestComponent } from './Test/test.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { AddDivisionComponent } from './Division/add-division/add-division.component';
import { ListDivisionComponent } from './Division/list-division/list-division.component';
import { EditDivisionComponent } from './Division/edit-division/edit-division.component';



const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

@NgModule({
  declarations: [
    AppComponent,
    BaseLayoutComponent,
    PagesLayoutComponent,
    PageTitleComponent,
    HeaderComponent,
    UserBoxComponent,
    SidebarComponent,
    FooterComponent,
    AnalyticsComponent,
    ForgotPasswordBoxedComponent,
    LoginBoxedComponent,
    RegisterBoxedComponent,
    ModalsComponent,
    TooltipsPopoversComponent,
    ChangePasswordComponent,
    AddClaimComponent,
    EditClaimComponent,
    DraftClaimComponent,
    StockiestClaimComponent,
    ClaimStatusComponent,
    StatusClaimComponent,
    ClaimApprovalComponent,
    FoApprovalComponent,
    UploadHoComponent,
    UploadDistComponent,
    AddUserComponent,
    ListUserComponent,
    TestComponent,
    AddDivisionComponent,
    ListDivisionComponent,
    EditDivisionComponent


  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgReduxModule,
    CommonModule,
    LoadingBarRouterModule,
    PerfectScrollbarModule,
    NgbModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PdfViewerModule,
    NgSelectModule,
    NgxDatatableModule,
    DataTablesModule,
    NgxMaskModule.forRoot(),
  ],
  exports: [
    NgxMaskModule
  ],
  providers: [
    {
      provide:
        PERFECT_SCROLLBAR_CONFIG,
      useValue:
        DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    ConfigActions,
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(
    private ngRedux: NgRedux<ArchitectUIState>,
    private devTool: DevToolsExtension
  ) {

    this.ngRedux.configureStore(
      rootReducer,
      {} as ArchitectUIState,
      [],
      [devTool.isEnabled() ? devTool.enhancer() : f => f]
    );

  }
}
