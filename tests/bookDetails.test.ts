import { Response } from 'express';
import Book from '../models/book'; // Adjust the import to your Book model path
import BookInstance from '../models/bookinstance'; // Adjust the import to your BookInstance model path
import { showBookDtls } from '../pages/book_details'; // Adjust the import to where showBookDtls is defined

describe('showBookDtls', () => {
    let res: Partial<Response>;
    const mockBook = {
        title: 'Mock Book Title',
        author: { name: 'Mock Author' }
    };
    const mockCopies = [
        { imprint: 'First Edition', status: 'Available' },
        { imprint: 'Second Edition', status: 'Checked Out' }
    ];

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(), // Chaining for status
            send: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    it('should return book details when the book and copies exist', async () => {
        // Mocking the Book model's findOne and populate methods
        const mockFindOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(), // Allows method chaining
            exec: jest.fn().mockResolvedValue(mockBook) // Resolves to your mock book
        });
        Book.findOne = mockFindOne;

        // Mocking the BookInstance model's find and select methods
        const mockFind = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(), // Select is called here
            exec: jest.fn().mockResolvedValue(mockCopies)
        });
        BookInstance.find = mockFind;

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(mockFindOne).toHaveBeenCalledWith({ _id: '12345' });
        expect(mockFindOne().populate).toHaveBeenCalledWith('author');
        expect(mockFind).toHaveBeenCalledWith({ book: '12345' });
        expect(mockFind().select).toHaveBeenCalledWith('imprint status');

        expect(res.send).toHaveBeenCalledWith({
            title: mockBook.title,
            author: mockBook.author.name,
            copies: mockCopies
        });
    });

    it('should return 404 if there book instance is null', async () => {
        const id = '12345';
        // Mocking the Book model's findOne method to throw an error
        BookInstance.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(), // Select is called here
            exec: jest.fn().mockResolvedValue(null)
        });

        // Act
        await showBookDtls(res as Response, id);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book details not found for book ${id}`);
    });

    it('should return 500 if there is an error fetching the book', async () => {
        // Mocking the Book model's findOne method to throw an error
        Book.findOne = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
    });

    it('should return 500 if there is an error fetching book instance', async () => {
        // Mocking the Book model's findOne method to throw an error
        BookInstance.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act
        await showBookDtls(res as Response, '12345');

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
    });

    it('should return 404 if non-string id', async () => {
        const id = {id: 123};

        // Act
        await showBookDtls(res as Response, id as unknown as string);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(`Book ${id} not found`);
    });

    it('should return 500 if book not found', async () => {
        const id = '12346';

        // finish function
        await showBookDtls(res as Response, id);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(`Error fetching book ${id}`);
    });

});
