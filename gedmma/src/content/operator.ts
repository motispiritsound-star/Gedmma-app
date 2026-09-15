/**
 * Who publishes this app.
 *
 * Both stores and the GDPR require a name and a way to reach somebody, and
 * neither can be invented here. As long as these are empty the privacy page
 * says so out loud, in a box that disappears the moment they are filled in.
 */
export const OPERATOR = {
  name: '',
  email: '',
  country: '',
}

export const operatorKnown = (): boolean => Boolean(OPERATOR.name && OPERATOR.email)
