const gql = String.raw;

const typeDefs = gql`
    scalar Upload

    type CodeBlock {
        value: String
    }

    type Language {
        _id: ID
        name: String
        codeBlocks: [CodeBlock]
    }

    type User {
        _id: ID
        email: String
        username: String
        createdAt: String
        updatedAt: String
    }

    type Query {
        authenticate: User
        getUserById(userId: ID!): User
        getLanguages: [Language]
        getCodeBlocks(languageId: ID!): [CodeBlock]
    }

    type Mutation {
        register(email: String!, username: String!, password: String!): User
        login(identifier: String!, password: String!): User
        logout: String
        createLanguage(name: String!): Language
        createCodeBlock(languageId: ID!, value: String!): CodeBlock
    }
`
module.exports = typeDefs;