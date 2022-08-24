import { uploadChipInformationMenu, uploadWaferInformationMenu, uploadDbitInformationMenu } from './state';

const menu = {
  text: 'Upload Metadata',
  menu_width: 200,
  menu: [
    {
      text: 'Wafer Table (.csv)',
      click: () => { uploadWaferInformationMenu.value = true; },
      disabled: false,
    },
    {
      text: 'Chip Table (.csv)',
      click: () => { uploadChipInformationMenu.value = true; console.log('Chip meta upload clicked'); },
      disabled: false,
    },
    {
      text: 'DBiT Run Table (.csv)',
      click: () => { uploadDbitInformationMenu.value = true; },
      disabled: false,
    },
  ],
};

export { menu };
