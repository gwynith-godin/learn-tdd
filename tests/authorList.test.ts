import Author from '../models/author'; // Adjust the import to your Author model path
import { getAuthorList, showAllAuthors } from '../pages/authors'; // Adjust the import to your function
import { Response } from 'express';
import * as authorModule from '../pages/authors';

describe('getAuthorList', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should fetch and format the authors list correctly', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            'Austen, Jane : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);
    });

    it('should format fullname as empty string if first name is absent', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: '',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            ' : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);
    });

    it('should return an empty array when an error occurs', async () => {
        // Arrange: Mock the Author.find() method to throw an error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Verify the result is an empty array
        expect(result).toEqual([]);

        // Verify that console.error was called
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching authors:', expect.any(Error));

        // Restore the original console.error implementation
        consoleErrorSpy.mockRestore();
    });

    it('should return lifetime with only deathdate for unknown birthday', async () => {
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: undefined,
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: undefined,
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: undefined,
                date_of_death: new Date('1870-06-09')
            }
        ];
        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        const expectedAuthors = [
            'Austen, Jane :  - 1817',
            'Ghosh, Amitav :  - 1910',
            'Tagore, Rabindranath :  - 1870'
        ];

        // Assert: Verify the result matches the expected output
        expect(result).toEqual(expectedAuthors);
    });
});
describe('showAllAuthors', () => {
    let res: Partial<Response>;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send the author list when authors exist', async () => {
        // Arrange
        const mockData = ['Author One : 1900 - 2000', 'Author Two : 1950 - 2020'];
        jest.spyOn(authorModule, 'getAuthorList').mockResolvedValue(mockData);

        // Act
        await showAllAuthors(res as Response);

        // Assert
        expect(res.send).toHaveBeenCalledWith(mockData);
    });

    it('should send an empty array when no authors exist', async () => {
        // Arrange
        jest.spyOn(authorModule, 'getAuthorList').mockResolvedValue([]);

        // Act
        await showAllAuthors(res as Response);

        // Assert
        expect(res.send).toHaveBeenCalledWith("No authors found");
    });
    it('should return "No authors found" when a processing error occurs', async () => {
        // Arrange
        jest.spyOn(authorModule, 'getAuthorList').mockRejectedValue(new Error('Database error'));

        // Act
        await showAllAuthors(res as Response);

        // Assert
        expect(res.send).toHaveBeenCalledWith('No authors found');
    });
});