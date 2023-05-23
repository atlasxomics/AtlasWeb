import { Client } from '@/api';
import store from '@/store';

export class DropDownFieldManager {
  client: any;

  assay_list: string[];

  species_list: string[];

  organ_list: string[];

  epitope_list: string[];

  group_list: string[];

  tissue_source_list: string[];

  pmid_list: string[];

  tissue_type_list: string[];

  constructor() {
    this.client = store.state.client;
    this.species_list = ['mus_musculus', 'homo_sapiens', 'rattus_norvegicus', 'danio_rerio_(zebrafish)', 'gallus_domesticus_(chicken)', 'pdx', 'Mouse'];
    this.organ_list = ['embryo', 'brain', 'kidney', 'polyp', 'liver', 'ovary', 'fallopian_tube_epithelium', 'cerebellum', 'retina', 'breast', 'bone_marrow', 'tonsil', 'scalp', 'pancreas', 'skin', 'tumor_allograft', 'melanoma_tumor', 'brain_tumor', 'colon_tumor', 'matched_liver_metastasis', 'tibialis_anterior_muscle_', 'hippocampus', 'lung', 'heart', 'embryonic_heart', 'spleen', 'colon', 'skull', 'thigh_skin', 'forearm_skin', 'shoulder_skin'];
    this.epitope_list = ['H3K27me3', 'H3K27ac', 'H3K4me3'];
    this.group_list = [];
    this.tissue_source_list = [];
    this.pmid_list = [];
    this.tissue_type_list = ['fresh_frozen', 'ffpe', 'efpe', 'fixed_frozen'];
    this.assay_list = ['ATAC-seq', 'Transcriptome', 'CUT&Tag'];
  }
}





