useForm

виды валидации
1. Валидация поля становится доступной после одного из 3 экшнов: action.submit(), actions.validate(name), actions.enableValidation(name).
2. Валидация по умолчанию происходит на action change поля после функцией actions.enableValidation().
3. Функции валидации задаются при инициализации. Переустановка изначальных валидаторов происходит после выполнения reinitialize.
4. Если у инпута задано несколько видов валидаторов, каждая выполнется в своё время.
5. Связанные инпуты при изменении основных инпутов валидируются в то время, как если бы экшны выполнялись на них самих.
6. Инпутам с типом валидации INIT валидация становится доступной при инициализации.
7. Валидация связанных инпутов включеается отдельно от основного инпута.

({
  initValues: {} | Promise | [],
  validate: {
    field_1: func,
    field_2: array([]),
    password: advanced({
      DEFAULT: validator,
      ENABLING: validator,
      SUBMITTING: validator,
    }),
    deep: {
      repeat: advanced({
        INIT: validator,
        DEFAULT: validator,
        ENABLING: validator,
        SUBMITTING: validator
        // dependantFields срабатывает:
        // при валидации поля password, если уже была запущена валидация на deep.repeat
        // deep.repeat так же валидируем на изменение deep
        // изменения предков изменяет потомков
        dependantFields: ['password']
      })
    }
  } | Promise | array([]),
  submitting: func
}) => [Form, state, actions]

const VALIDATION_TYPES = {
  INIT: Symbol('INIT'),
  DEFAULT: Symbol('DEFAULT'),
  ENABLING: Symbol('ENABLING'),
  SUBMITTING: Symbol('SUBMITTING'),
}

const getInitState = initValues => ({
  values: initValues,
  submitting: false,
  submitted: false,
  failed: false,
  canValidate: {},
  errors: {},
  loaders: {},
  initializing: false
})

// validators
type ExtendedValidator = {
  DEFAULT?: Validator,
  ENABLING?: Validator,
  SUBMITTING?: Validator,
  dependantFields?: Entity(string, Validator)
}

type Validator = Validator[] |
  (value, ...dependantValues: any[]) => (Promise | ) |
  ExtendedValidator

<Form>
  <Input name='k' />
</Form>
