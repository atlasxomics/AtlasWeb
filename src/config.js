const config = {
  atlasxbrowser: {
    root_dir: 'Images',
    barcode_files_path: 'BarcodeFiles',
    lims_available: true,
    barcode_mapping: {
      1: 'bc50v1-24.txt',
      2: 'bc50v2-24.txt',
      3: 'bc50v3-24.txt',
      4: 'bc50v4-24.txt',
      5: 'bc96v2-24.txt',
      '1 (normal)': 'bc50v1-24.txt',
      '2 (reverseB)': 'bc50v2-24.txt',
      '3 (reverseA)': 'bc50v3-24.txt',
      '4 (reverseAB)': 'bc50v4-24.txt',
    },
  },
};

module.exports = config;
