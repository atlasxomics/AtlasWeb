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
    this.species_list = [];
    this.organ_list = [];
    this.epitope_list = [];
    this.group_list = [];
    this.tissue_source_list = [];
    this.pmid_list = [];
    this.tissue_type_list = [];
    this.assay_list = [];
  }
}
