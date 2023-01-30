import { shallowMount, createLocalVue, mount } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import Vuetify from 'vuetify';


describe('Test WebUploader', () => {
    let localVue: any = null;
    let content: any = null;
    let wrapper: any = null;
    
    beforeEach(() => {
        localVue = require('vue');
        localVue.use(VueCompositionApi);
        localVue.use(Vuetify);
        content = require('../modules/WebUploader.vue').default;
        wrapper = shallowMount(content, { localVue });
    })
    afterEach(() => {
        localVue = null;
    })
    jest.mock('../modules/DropDownFieldManager', () => {
        return {
            DropDownFieldManager: jest.fn().mockImplementation(() =>
            {
                return {
                assay_list: ['test1', 'test2'],
                species_list: ['test1', 'test2'],
                organ_list: ['test1', 'test2'],
                epitope_list: ['test1', 'test2'],
                group_list: ['test1', 'test2'],
                tissue_source_list: ['test1', 'test2'],
                pmid_list: ['test1', 'test2'],
                tissue_type_list: ['test1', 'test2'],
                };
            })
        }
    });
    test('ensure html loads', () => {
        expect(wrapper.html()).toContain('Run Information');
    })
})

