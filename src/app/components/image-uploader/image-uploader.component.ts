import { Component, OnInit, DoCheck, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { AppD3Service } from '../../services/d3.service';
import { ConstantsService } from '../../services/constants.service';

const
  ROOT_ELEM_CLASS = 'top-plate_imageUploader',
  d3 = AppD3Service.getD3();

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ImageUploaderComponent implements OnInit, DoCheck {

  @Input() public model: any;

  public rootElem: any;

  public onChange (onChangeEvent) {

    let
      self = this,
      originalImage = onChangeEvent.target.files.item(0),
      fReader = new FileReader();

    fReader.onload = function (readEvent) {
      self.model.originalImage = originalImage;
      self.model.dataUrl = readEvent.target['result'];
      self.model.fileExtension = originalImage.name.split('.').pop();
      self.model.contentType = originalImage.type;
      self.model.isUploaded = true;
      self.model['defaultImage'] && delete self.model['defaultImage'];
      self.rootElem
        .select('.top-plate_imageUploader_background')
        .style('background-image', 'url(' + self.model.dataUrl + ')');
      typeof self.model['onChange'] === 'function' && self.model['onChange']();
    };

    fReader.readAsDataURL(originalImage);
  }

  public clearUploadedImage () {
    if (!this.model.isUploaded) return;
    delete this.model.originalImage;
    delete this.model.dataUrl;
    delete this.model.isUploaded;
    typeof this.model['onChange'] === 'function' && this.model['onChange']();
  }

  public get hasImage () {
    return this.model && (this.model['isUploaded'] || this.model['defaultImage']);
  }

  constructor (
    private reference: ElementRef
  ) {}

  ngOnInit () {
    this.rootElem = d3.select(this.reference.nativeElement).classed(ROOT_ELEM_CLASS, true);
  }

  ngDoCheck () {
    let self = this;
    if (!self.model) return;
    else if (self.model.reset) {



      this.model['defaultImage'] && this.rootElem
        .select('.top-plate_imageUploader_background')
        .style('background-image', 'url(' + this.model['defaultImage'] + ')');
      return;
    } else self.model.reset = () => self.clearUploadedImage();
  }
}
