import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BigNumberPipe } from './pipes/big-number.pipe';
import { SplittedStringPipe } from './pipes/splitted-string.pipe';
import { HeaderComponent } from './components/header/header.component';
import { AnimatedBackgroundComponent } from './components/animated-background/animated-background.component';
import { PlatePreviewComponent } from './components/plate-preview/plate-preview.component';
import { ModalComponent } from './components/modal/modal.component';
import { MenuComponent } from './components/menu/menu.component';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { TpPaginationComponent } from './components/tp-pagination/tp-pagination.component';
import { TpFooterComponent } from './components/tp-footer/tp-footer.component';
import { TpInfiniteListComponent } from './components/tp-infinite-list/tp-infinite-list.component';
import { TpHeaderComponent } from './components/tp-header/tp-header.component';
import { TpSwitchComponent } from './components/tp-switch/tp-switch.component';
import { TpScrollableComponent } from './components/tp-scrollable/tp-scrollable.component';
import { TpGrowlComponent } from './components/tp-growl/tp-growl.component';
import { TpFilterComponent } from './components/tp-filter/tp-filter.component';
import { TpGridComponent } from './components/tp-grid/tp-grid.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],

  providers: [],

  declarations: [
    BigNumberPipe,
    SplittedStringPipe,
    HeaderComponent,
    AnimatedBackgroundComponent,
    PlatePreviewComponent,
    ModalComponent,
    MenuComponent,
    ImageUploaderComponent,
    TpPaginationComponent,
    TpFooterComponent,
    TpInfiniteListComponent,
    TpHeaderComponent,
    TpSwitchComponent,
    TpScrollableComponent,
    TpGrowlComponent,
    TpFilterComponent,
    TpGridComponent
  ],

  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],

  exports: [
    BigNumberPipe,
    SplittedStringPipe,
    HeaderComponent,
    AnimatedBackgroundComponent,
    PlatePreviewComponent,
    ModalComponent,
    MenuComponent,
    ImageUploaderComponent,
    TpPaginationComponent,
    TpFooterComponent,
    TpInfiniteListComponent,
    TpHeaderComponent,
    TpSwitchComponent,
    TpScrollableComponent,
    TpGrowlComponent,
    TpFilterComponent,
    TpGridComponent
  ]
})

export class AppCommonModule {}
