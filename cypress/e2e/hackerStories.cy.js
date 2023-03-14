import { faker } from '@faker-js/faker'
const stories = require('../fixtures/stories.json')
const emptyStories = require('../fixtures/emptyStories.json')

describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'

  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories')

      cy.visit('/')
      cy.wait('@getStories')
    })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '1'
        }
      }).as('getNextStories')

      cy.get('.item').should('have.length', 20)

      cy.contains('More').should('be.visible').click()
      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })

    it('searches via the last searched term', () => {
      cy.intercept(
        'GET',
        `**/search?query=${newTerm}&page=0`
      ).as('getNewTerm')

      cy.get('#search')
        .should('be.visible')
        .clear()
        .type(`${newTerm}{enter}`)

      cy.wait('@getNewTerm')

      cy.getLocalStorage('search')
        .should('eq', newTerm)

      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
        .click()

      cy.wait('@getStories')

      cy.getLocalStorage('search')
        .should('eq', initialTerm)

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`)
        .should('be.visible')
    })
  })

  context('Hitting the mocked API', () => {
    beforeEach(() => {
      cy.intercept(
        'GET',
        `**/search?query=${initialTerm}&page=0`,
        stories
      ).as('getStories')

      cy.visit('/')
      cy.wait('@getStories')
    })

    context('List of stories', () => {
      it('shows the right data for all rendered stories', () => {
        cy.get('.item').should('have.length', 2)

        cy.get('.item')
          .first()
          .should('contain', stories.hits[0].title)
          .and('contain', stories.hits[0].author)

        cy.get('.item')
          .last()
          .should('contain', stories.hits[1].title)
          .and('contain', stories.hits[1].author)
      })

      it('shows one less story after dimissing the first one', () => {
        cy.get('.button-small')
          .first()
          .click()

        cy.get('.item').should('have.length', 1)
      })

      context('Order by', () => {
        it('orders by title', () => {
          cy.get('.list-header-button:contains(Title)')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[0].title)

          cy.get('.list-header-button:contains(Title)')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[1].title)
        })

        it('orders by author', () => {
          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[0].author)

          cy.get('.list-header-button:contains(Author)')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[1].author)
        })

        it('orders by comments', () => {
          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[0].num_comments)

          cy.get('.list-header-button:contains(Comments)')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[1].num_comments)
        })

        it('orders by points', () => {
          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[0].points)

          cy.get('.list-header-button:contains(Points)')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('be.visible')
            .and('contain', stories.hits[1].points)
        })
      })
    })

    context('Search', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
          `**/search?query=${initialTerm}&page=0`,
          emptyStories
        ).as('getEmptyStories')

        cy.intercept(
          'GET',
          `**/search?query=${newTerm}&page=0`,
          stories
        ).as('getStories')

        cy.visit('/')
        cy.wait('@getEmptyStories')

        cy.get('#search')
          .should('be.visible')
          .clear()
      })

      it('types and hits ENTER', () => {
        cy.get('#search')
          .should('be.visible')
          .type(`${newTerm}{enter}`)

        cy.wait('@getStories')

        cy.get('.item').should('have.length', 2)

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

        cy.wait('@getStories')

        cy.get('.item').should('have.length', 2)

        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
      })

      it('types and submits the form directly', () => {
        cy.get('form input[type="text"]')
          .should('be.visible')
          .clear()
          .type(newTerm)
        cy.get('form').submit()

        cy.wait('@getStories')

        cy.get('.item').should('have.length', 2)
      })

      context('Last searches', () => {
        it('shows a max of 5 buttons for the last searched terms', () => {
          cy.intercept(
            'GET',
            '**/search**',
            emptyStories
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
})

// Hrm, how would I simulate such errors?
// Since I still don't know, the tests are being skipped.
// TODO: Find a way to test them out.
context('Errors', () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { statusCode: 500 }
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
      { forceNetworkError: true }
    ).as('getNetworkError')

    cy.visit('/')
    cy.wait('@getNetworkError')

    cy.get('.item').should('not.exist')
    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })
})