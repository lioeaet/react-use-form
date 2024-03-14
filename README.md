useForm

({
  initValues: {} | Promise | [],
  validate: {
    field_1: func,
    field_2: array([]),
    password: advanced({
      BLURED_TOUCH: validator,
      BLUR: validator,
      SUBMIT: validator,
    }),
    deep: {
      repeat: advanced({
        INIT: validator,
        BLURED_TOUCH: validator,
        BLUR: validator,
        SUBMIT: validator
        // dependantFields срабатывает:
        // при валидации поля password, если уже была запущена валидация на deep.repeat
        // deep.repeat так же валидируем на изменение deep
        // изменения предков изменяет потомков
        dependantFields: ['password']
      })
    }
  } | Promise | array([]),
  submit: func
}) => [Form, state, actions]

const VALIDATION_TYPES = {
  INIT: Symbol('INIT'),
  BLURED_TOUCH: Symbol('BLURED_TOUCH'),
  BLUR: Symbol('BLUR'),
  SUBMIT: Symbol('SUBMIT'),
}

const getInitState = initValues => ({
  values: initValues,
  submitting: false,
  submitted: false,
  failed: false,
  focused: {},
  touched: {},
  errors: {},
  loaders: {},
  initializing: false
})

// validators
type ExtendedValidator = {
  BLURED_TOUCH?: Validator,
  BLUR?: Validator,
  SUBMIT?: Validator,
  dependantFields?: Entity(string, Validator)
}

type Validator = Validator[] |
  (value, ...dependantValues: any[]) => (Promise | ) |
  ExtendedValidator

<Form>
  <Input name='k' />
</Form>
