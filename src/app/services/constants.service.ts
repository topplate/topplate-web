import { Injectable } from '@angular/core';

const CONSTANTS = {

  'ROUTES': {
    'HOME': '',
    'SELECT_ENV': 'select-environment',
    'HOW_IT_WORKS': 'how-it-works',
    'PLATES': 'plates',
    'WINNERS': 'winners',
    'PLATE': 'plate',
    'PROFILE': 'profile',
    'CHARITY_CHOICE': 'charity-choice',
    'CONTACTS': 'contacts',
    'COPYRIGHT': 'copyright',
    'PRIVACY_TERM': 'privacy-term',
    'SEARCH': 'search',
    'EMPTY': 'empty',
    'SIGN_UP': 'sign-up',
    'EDIT_PROFILE': 'edit-profile',
    'CHANGE_PASSWORD': 'change-password',
    'OTHERWISE': '**'
  },

  'ADMIN_ROUTES': {
    'ADMIN_ENTRANCE': 'admin-entrance',
    'MANAGE_USERS': 'manage-users',
    'MANAGE_PLATES': 'manage-plates',
    'MANAGE_GENERAL': 'manage-general',
    'MANAGE_REQUESTS': 'manage-requests',
    'MANAGE_CONTACTS': 'manage-contacts',
    'MANAGE_CHARITIES': 'manage-charities'
  },

  'REST_API': {
    'LOGIN_FB': 'login-fb',
    'LOGIN_GP': 'login-gp',
    'LOGIN_EM': 'login-em',
  },

  'ENVIRONMENTS': {
    'RESTAURANT': 'restaurant',
    'HOMEMADE': 'homemade'
  },

  'AUTH_TOKEN': 'auth-token',

  'TYPES': {
    'STRING': 'string',
    'NUMBER': 'number',
    'OBJECT': 'object'
  },

  'KEYS': {
    'ENTER_KEY': 13
  }

};

@Injectable()

export class ConstantsService {

  public static getConstants () { return CONSTANTS; }

}
