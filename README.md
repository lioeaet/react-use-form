# useForm

виды валидации
1. CHANGE-валидация поля становится доступной после одного из 2 экшнов: actions.blur(name) (onBlur из `useField(name)`), action.submit().
2. По умолчанию валидация происходит на action change (onChange из `useField(name)`) поля с доступной валидацией.
3. Функции валидации задаются при инициализации. Переустановка изначальных валидаторов происходит после выполнения reinitialize.
4. Асинхронные валидации производятся не дожидаясь завершения друг друга. В поле ошибки попадает первая ошибка, возвращённая из валидатора, выполненного ранее остальных.
5. dependantFields при изменении основных инпутов валидируются в то время, как если бы экшны выполнялись на них самих.
6. Инпуты с типом валидации BLUR валидируются при выполнении actions.blur() и перед actions.submit().
7. Валидация связанных инпутов включеается отдельно от основного инпута.
8. В библиотеке есть зарезервированый для массивов ключ поля 'i'.
9. Валидация с предыдущими значениями инпутов возвращает закешированный результат ошибки

## TODO

!избавиться от имени array.name, перевести всё на array.i.name

1. Submit
2. Array: replace, insert, remove
3. inner arrays?


useSessionForm


({
  initValues: {} | [],
  validate: {
    field_1: func,
    field_2: array([]),
    password: advanced({
      CHANGE: validator,
      BLUR: validator,
      SUBMIT: validator,
    }),
    deep: {
      repeat: advanced({
        CHANGE: validator,
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
  CHANGE: Symbol('CHANGE'),
  BLUR: Symbol('BLUR'),
  SUBMIT: Symbol('SUBMIT'),
}

const getInitState = initValues => ({
  values: initValues,
  submit: false,
  submitted: false,
  failed: false,
  canValidate: {},
  errors: {},
  loaders: {},
  initializing: false
})

// validators
type ExtendedValidator = {
  CHANGE?: Validator,
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
