export interface Post {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePostRequest {
    name: string;
    description: string;
}

export interface UpdatePostRequest {
    name: string;
    description: string;
}

export interface Error {
    message: string;
}

export type paths = {
    '/posts': {
        get: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            responses: {
                200: {
                    schema: Post[];
                };
                400: {
                    schema: Error;
                };
                404: {
                    schema: Error;
                };
            };
        };
        post: {
            requestBody: {
                content: {
                    'application/json': CreatePostRequest;
                };
            };
            responses: {
                201: {
                    schema: Post;
                };
                400: {
                    schema: Error;
                };
            };
        };
        delete: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            responses: {
                204: never;
                400: {
                    schema: Error;
                };
            };
        };
        put: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            requestBody: {
                content: {
                    'application/json': UpdatePostRequest;
                };
            };
            responses: {
                200: {
                    schema: Post;
                };
                400: {
                    schema: Error;
                };
            };
        };
    };
}
