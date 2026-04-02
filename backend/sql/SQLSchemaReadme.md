Tables:
    - technology
        - definition:
            id
            name
            foreign key to blip
            foreign key to quadrant
            updatedAt
            createdAt
    - rings
        - definition:
            id
            name "Adopt Trial Assess Hold"
    - quadrants
        - definition:
            id
            name "Techniques Tools Platforms LanguagesFrameworks"
    - blips
        - definition:
            id
            context type:json
            updatedAt
            createdAt
    - users
        - definition:
            id
            name
            email
            username
            HASHED password
            createdAt
            lastLoggedIn
    - userTechnologies
        - definition:
            id
            foreign key to user
            foreign key to technologies
            createAt
            updatedAt
            foreign key rings