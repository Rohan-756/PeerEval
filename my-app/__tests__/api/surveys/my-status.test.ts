import { GET } from '@/app/api/surveys/[assignmentId]/my-status/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyResponse: {
      count: jest.fn(),
    },
  },
}));

describe('GET /api/surveys/[assignmentId]/my-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/my-status?respondentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and respondentId are required');
  });

  it('should return 400 if respondentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/assignment1/my-status', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and respondentId are required');
  });

  it('should return submitted: true if responses exist', async () => {
    (prisma.surveyResponse.count as jest.Mock).mockResolvedValue(3);

    const req = new Request('http://localhost/api/surveys/assignment1/my-status?respondentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.submitted).toBe(true);
    expect(prisma.surveyResponse.count).toHaveBeenCalledWith({
      where: {
        assignmentId: 'assignment1',
        respondentId: 'student1',
      },
    });
  });

  it('should return submitted: false if no responses exist', async () => {
    (prisma.surveyResponse.count as jest.Mock).mockResolvedValue(0);

    const req = new Request('http://localhost/api/surveys/assignment1/my-status?respondentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.submitted).toBe(false);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyResponse.count as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/my-status?respondentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

