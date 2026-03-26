from .scanner import scan_content
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Keyword, ContentItem, Flag
from .serializers import KeywordSerializer, ContentItemSerializer, FlagSerializer


class KeywordListCreateView(APIView):

    def post(self, request):
        serializer = KeywordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FlagListView(APIView):

    def get(self, request):
        flags = Flag.objects.select_related('keyword', 'content_item').all()
        serializer = FlagSerializer(flags, many=True)
        return Response(serializer.data)


class FlagDetailView(APIView):

    def patch(self, request, pk):
        try:
            flag = Flag.objects.get(pk=pk)
        except Flag.DoesNotExist:
            return Response(
                {'error': 'Flag not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        allowed_fields = {'status'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        new_status = data.get('status')
        if new_status not in ['pending', 'relevant', 'irrelevant']:
            return Response(
                {'error': 'Invalid status. Choose from: pending, relevant, irrelevant'},
                status=status.HTTP_400_BAD_REQUEST
            )

        flag.status = new_status
        flag.reviewed_at = timezone.now()
        flag.save()

        serializer = FlagSerializer(flag)
        return Response(serializer.data)


class IngestView(APIView):

    def post(self, request):
        content_id = request.data.get('content_id')
        if not content_id:
            return Response(
                {'error': 'content_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            content_item = ContentItem.objects.get(pk=content_id)
        except ContentItem.DoesNotExist:
            return Response(
                {'error': 'ContentItem not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        flags = scan_content(content_item)
        return Response({
            'message': f'{len(flags)} flags created or updated',
            'flags': FlagSerializer(flags, many=True).data
        })
