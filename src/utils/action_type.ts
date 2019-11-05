export const ACTION_TYPE_PREFIX = '@@ReduxPods'

export const INTERNAL_ACTION_TYPES = {
  init: generatePodActionType('Internal', 'Init'),
  connect: generatePodActionType('Internal', 'Connect'),
  registerTrackers: generatePodActionType('Internal', 'RegisterTrackers'),
  tracker: generatePodActionType('Internal', 'Tracker')
}

export function generatePodActionType(...suffix: string[]) {
  return `${ACTION_TYPE_PREFIX}/${suffix.join('/')}`
}

export function getActionKey(key?: string) {
  return generatePodActionType('Action', key)
}

export function getReversedActionKey(actionKey: string) {
  return actionKey.replace(getActionKey(), '')
}

export function isActionOf(podPath: string, action: any) {
  return action.type.startsWith(getActionKey()) && podPath === action.path
}
