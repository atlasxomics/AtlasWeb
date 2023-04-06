const config = {
  atlasxbrowser: {
    root_dir: 'Images',
    root_dir_spatial: 'Images_spatial',
    barcode_files_path: 'BarcodeFiles',
    bucket_name: 'atx-illumina',
    bucket_name_spatial: 'atx-illumina',
    lims_available: true,
    barcode_mapping: {
      1: 'bc50v1-24.txt',
      2: 'bc50v2-24.txt',
      3: 'bc50v3-24.txt',
      4: 'bc50v4-24.txt',
      '1 (normal)': 'bc50v1-24.txt',
      '2 (reverseB)': 'bc50v2-24.txt',
      '3 (reverseA)': 'bc50v3-24.txt',
      '4 (reverseAB)': 'bc50v4-24.txt',
    },
  },
};

module.exports = config;
