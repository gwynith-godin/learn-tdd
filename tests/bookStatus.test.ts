import { Response } from "express";
import BookInstance from "../models/bookinstance";
import { showAllBooksStatus } from "../pages/books_status";

describe("showAllBooksStatus", () => {
    // Arrange: Prepare mock data and response object
    let res: Partial<Response>;
    const mockBookInstances = [
        { book: { title: "Mock Book Title" }, status: "Available" },
        { book: { title: "Mock Book Title 2" }, status: "Available" },
    ];
    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    })

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return all books with status 'Available'", async () => {
        // Arrange: Mock the BookInstance model's find and populate methods
        const mockFind = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBookInstances)
        });
        BookInstance.find = mockFind;

        // Act: Call the function to show all books with status 'Available'
        await showAllBooksStatus(res as Response);

        // Assert: Check if the response is as expected
        expect(mockFind).toHaveBeenCalledWith({ status: { $eq: "Available" } });
        expect(BookInstance.find().populate).toHaveBeenCalledWith('book');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([
            "Mock Book Title : Available",
            "Mock Book Title 2 : Available",
        ]);
    });

    it("should return empty list if no books are available", async () => {
        // Arrange: Mock the BookInstance model's find and populate methods
        const mockFind = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });
        BookInstance.find = mockFind;

        // Act: Call the function to show all books with status 'Available'
        await showAllBooksStatus(res as Response);

        // Assert: Check if the response is as expected
        expect(mockFind).toHaveBeenCalledWith({ status: { $eq: "Available" } });
        expect(BookInstance.find().populate).toHaveBeenCalledWith('book');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith([]);
    });

    it('should return 500 if there is an error fetching the book', async () => {
        // Arrange
        const mockFind = jest.fn().mockReturnValue({
            populate: jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            })
        });
        BookInstance.find = mockFind;

        // Act
        await showAllBooksStatus(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Status not found');
    });
});