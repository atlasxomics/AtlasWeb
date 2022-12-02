import { Client } from '@/api';
import store from '@/store';

export class DBConnection {
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
    this.assign_field_options();
  }

  async assign_field_options() {
    const field_options = await this.client.get_available_fields();
    this.assay_list = field_options.assay_list;
    this.species_list = field_options.species_list;
    this.organ_list = field_options.organ_list;
    this.epitope_list = field_options.antibody_list;
    this.group_list = field_options.group_list;
    this.tissue_source_list = field_options.tissue_source_list;
    this.pmid_list = field_options.publication_list;
    this.tissue_type_list = field_options.tissue_type_list;
  }
}
