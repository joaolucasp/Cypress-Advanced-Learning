import { faker } from '@faker-js/faker'

describe('Hacker Stories', () => {
  beforeEach(() => {
    cy.intercept({
      method: 'GET',
      pathname: '**/search',
      query: {
        query: 'React',
        page: '0',
      },
    }).as('getStories')

    cy.visit('/')
    cy.wait('@getStories')
  })

  it('shows the footer', () => {
    cy.get('footer')
      .should('be.visible')
      .and('contain', 'Icons made by Freepik from www.flaticon.com')
  })

  context('List of stories', () => {
    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I assert on the data?
    // This is why this test is being skipped.
    // TODO: Find a way to test it out.
    it.skip('shows the right data for all rendered stories', () => { })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: 'React',
          page: '1',
        },
      }).as('getNextStories')

      cy.get('.item').should('have.length', 20)

      cy.contains('More').should('be.visible').click()

      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })

    it('shows only nineteen stories after dimissing the first story', () => {
      cy.get('.button-small')
        .first()
        .should('be.visible')
        .click()

      cy.get('.item').should('have.length', 19)
    })

    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I test ordering?
    // This is why these tests are being skipped.
    // TODO: Find a way to test them out.
    context.skip('Order by', () => {
      it('orders by title', () => { })

      it('orders by author', () => { })

      it('orders by comments', () => { })

      it('orders by points', () => { })
    })
  })

  context('Search', () => {
    const initialTerm = 'React'
    const newTerm = 'Cypress'

    beforeEach(() => {
      cy.intercept(
        'GET',
        `**/search?query=${newTerm}&page=0`,
      ).as('getNewTerm')

      cy.get('#search')
        .clear()
        .should('be.visible')
    })

    it('types and hits ENTER', () => {
      cy.get('#search')
        .should('be.visible')
        .type(`${newTerm}{enter}`)

      cy.wait('@getNewTerm')

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('types and clicks the submit button', () => {
      cy.get('#search')
        .should('be.visible')
        .type(newTerm)
      cy.contains('Submit')
        .should('be.visible')
        .click()

      cy.wait('@getNewTerm')

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('types and submits the form directly', () => {
      cy.get('form input[type="text"]')
        .should('be.visible')
        .clear()
        .type(newTerm)
      cy.get('form').submit()

      cy.wait('@getNewTerm')

      cy.get('.item').should('have.length', 20)
    })

    context('Last searches', () => {
      it('searches via the last searched term', () => {
        cy.get('#search')
          .should('be.visible')
          .type(`${newTerm}{enter}`)

        cy.wait('@getNewTerm')

        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
          .click()

        cy.wait('@getStories')

        cy.get('.item').should('have.length', 20)
        cy.get('.item')
          .first()
          .should('contain', initialTerm)
        cy.get(`button:contains(${newTerm})`)
          .should('be.visible')
      })

      it('shows a max of 5 buttons for the last searched terms', () => {
        cy.intercept(
          'GET',
          `**/search**`,
        ).as('getRandomTerm')

        Cypress._.times(6, () => {
          cy.get('#search')
            .should('be.visible')
            .clear()
            .type(`${faker.random.word()}{enter}`)

          cy.wait('@getRandomTerm')
        })

        cy.get('.last-searches button')
          .should('have.length', 5)
      })
    })
  })
})

// Hrm, how would I simulate such errors?
// Since I still don't know, the tests are being skipped.
// TODO: Find a way to test them out.
context.only('Errors', () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { statusCode: 500 },
    ).as('getServerError')

    cy.visit('/')
    cy.wait('@getServerError')

    cy.get('.item').should('not.exist')
    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })

  it('shows "Something went wrong ..." in case of a network error', () => { 
    cy.intercept(
      'GET',
      '**/search**',
      { forceNetworkError: true },
    ).as('getNetworkError')

    cy.visit('/')
    cy.wait('@getNetworkError')

    cy.get('.item').should('not.exist')
    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })
})