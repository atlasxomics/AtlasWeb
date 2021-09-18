import { uploadChipInformationMenu, uploadWaferInformationMenu, uploadDbitInformationMenu } from './state';

const menu = {
  text: 'Upload Metadata',
  menu_width: 200,
  menu: [
    {
      text: 'Wafer Table (.csv)',
      click: () => { uploadWaferInformationMenu.value = true; },
      disabled: true,
    },
    {
      text: 'Chip Table (.csv)',
      click: () => { uploadChipInformationMenu.value = true; },
      disabled: false,
    },
    {
      text: 'DBiT Run Table (.csv)',
      click: () => { uploadDbitInformationMenu.value = true; },
      disabled: true,
    },
  ],
};

export { menu };
